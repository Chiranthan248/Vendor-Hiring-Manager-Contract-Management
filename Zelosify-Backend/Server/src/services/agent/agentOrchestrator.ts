import Groq from "groq-sdk";
import { resumeParsingTool, type ParsedResume } from "./tools/resumeParsingTool.js";
import { skillNormalizationTool, extractSkillsFromText } from "./tools/skillNormalizationTool.js";
import { scoringEngineTool, type ScoringOutput } from "./tools/scoringEngineTool.js";
import { logger } from "../../utils/logger.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface AgentInput {
  s3Key: string;
  openingTitle: string;
  openingDescription: string;
  requiredSkills: string[];
  experienceMin: number;
  experienceMax: number | null;
  jobLocation: string;
}

export interface AgentOutput {
  recommended: boolean;
  score: number;
  confidence: number;
  reason: string;
  latencyMs: number;
  version: string;
}

const AGENT_VERSION = "groq-llama3-v1.0";

const tools: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "parse_resume",
      description: "Parse a resume from S3 and extract structured information including experience, skills, location and education",
      parameters: {
        type: "object",
        properties: {
          s3Key: { type: "string", description: "The S3 key of the resume file" },
        },
        required: ["s3Key"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "normalize_skills",
      description: "Normalize and standardize a list of skills to canonical names",
      parameters: {
        type: "object",
        properties: {
          skills: {
            type: "array",
            items: { type: "string" },
            description: "List of skills to normalize",
          },
        },
        required: ["skills"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "score_candidate",
      description: "Calculate deterministic match score between candidate and job requirements",
      parameters: {
        type: "object",
        properties: {
          candidateExperienceYears: { type: "number" },
          candidateSkills: { type: "array", items: { type: "string" } },
          candidateLocation: { type: "string" },
          requiredExperienceMin: { type: "number" },
          requiredExperienceMax: { type: "number" },
          requiredSkills: { type: "array", items: { type: "string" } },
          jobLocation: { type: "string" },
        },
        required: [
          "candidateExperienceYears",
          "candidateSkills",
          "candidateLocation",
          "requiredExperienceMin",
          "requiredSkills",
          "jobLocation",
        ],
      },
    },
  },
];

async function executeToolCall(
  toolName: string,
  toolArgs: any,
  s3Key: string,
  parsedResume: ParsedResume | null
): Promise<{ result: any; updatedResume: ParsedResume | null }> {
  if (toolName === "parse_resume") {
    logger.agent("tool_execute", { tool: "parse_resume", s3Key });
    const result = await resumeParsingTool(s3Key);
    result.skills = extractSkillsFromText(result.rawText);
    result.normalizedSkills = skillNormalizationTool(result.skills);
    result.keywords = result.skills.slice(0, 10);
    return { result, updatedResume: result };
  }

  if (toolName === "normalize_skills") {
    logger.agent("tool_execute", { tool: "normalize_skills" });
    const normalized = skillNormalizationTool(toolArgs.skills || []);
    return { result: normalized, updatedResume: parsedResume };
  }

  if (toolName === "score_candidate") {
    logger.agent("tool_execute", { tool: "score_candidate" });
    const result = scoringEngineTool(toolArgs);
    return { result, updatedResume: parsedResume };
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

export async function runRecommendationAgent(
  input: AgentInput
): Promise<AgentOutput> {
  const startTime = Date.now();

  logger.agent("agent_start", { title: input.openingTitle, s3Key: input.s3Key });

  const systemPrompt = `You are an expert HR recommendation agent. Your job is to evaluate candidate resumes against job requirements.

You MUST follow this exact workflow:
1. Call parse_resume to extract candidate information
2. Call normalize_skills with the extracted skills
3. Call score_candidate with the normalized data and job requirements
4. Based on the scoring results, provide your final recommendation

Job Requirements:
- Title: ${input.openingTitle}
- Description: ${input.openingDescription}
- Required Skills: ${input.requiredSkills.join(", ")}
- Experience: ${input.experienceMin}-${input.experienceMax || "∞"} years
- Location: ${input.jobLocation}

Decision thresholds:
- Score >= 0.75: Recommended
- Score 0.5-0.74: Borderline
- Score < 0.5: Not Recommended

IMPORTANT: Never make up information. Only use data from tool outputs.`;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Please evaluate the candidate resume at S3 key: ${input.s3Key}. Follow the workflow and provide a recommendation.`,
    },
  ];

  let parsedResume: ParsedResume | null = null;
  let scoringOutput: ScoringOutput | null = null;
  let iterations = 0;
  const MAX_ITERATIONS = 6;

  const MAX_RETRIES = 3;
  let retryCount = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    logger.agent("agent_iteration", { iteration: iterations });

    let response;
    let lastError;

    // Retry logic for malformed outputs
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages,
          tools,
          tool_choice: "auto",
          max_tokens: 1024,
          temperature: 0.1,
        });

        // Log token usage
        if (response.usage) {
          logger.agent("token_usage", {
            iteration: iterations,
            attempt,
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          });
        }

        lastError = null;
        break; // Success — exit retry loop
      } catch (error: any) {
        lastError = error;
        retryCount++;
        logger.error("llm_retry", error, { iteration: iterations, attempt });

        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }
    }

    if (lastError || !response) {
      logger.error("llm_failed_after_retries", lastError, { iterations, retryCount });
      break;
    }

    const message = response.choices[0].message;

    // Validate message structure
    if (!message || typeof message !== "object") {
      logger.error("malformed_llm_response", new Error("Invalid message structure"), { iterations });
      retryCount++;
      continue;
    }

    messages.push(message as any);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      logger.agent("agent_complete", { iterations, retryCount });
      break;
    }

    for (const toolCall of message.tool_calls) {
      const toolName = toolCall.function.name;
      let toolArgs: any = {};

      try {
        toolArgs = JSON.parse(toolCall.function.arguments);
      } catch (parseError) {
        // Retry logic for malformed tool arguments
        logger.error("malformed_tool_args", parseError, { tool: toolName, raw: toolCall.function.arguments });
        retryCount++;
        toolArgs = {};
      }

      try {
        const { result, updatedResume } = await executeToolCall(
          toolName,
          toolArgs,
          input.s3Key,
          parsedResume
        );

        if (updatedResume) parsedResume = updatedResume;
        if (toolName === "score_candidate") scoringOutput = result;

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      } catch (error: any) {
        logger.error("tool_error", error, { tool: toolName });
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: error.message }),
        });
      }
    }
  }

  logger.agent("agent_summary", {
    totalIterations: iterations,
    totalRetries: retryCount,
    latencyMs: Date.now() - startTime,
  });

  const latencyMs = Date.now() - startTime;

  if (!scoringOutput) {
    scoringOutput = scoringEngineTool({
      candidateExperienceYears: parsedResume?.experienceYears || 0,
      candidateSkills: parsedResume?.normalizedSkills || [],
      candidateLocation: parsedResume?.location || "Unknown",
      requiredExperienceMin: input.experienceMin,
      requiredExperienceMax: input.experienceMax,
      requiredSkills: input.requiredSkills,
      jobLocation: input.jobLocation,
    });
  }

  const recommended = scoringOutput.finalScore >= 0.75;
  const confidence = Math.min(
    0.95,
    scoringOutput.finalScore + 0.1 * (parsedResume ? 1 : 0)
  );

  const lastMessage = messages[messages.length - 1];
  let reason = "";

  if (lastMessage.role === "assistant" && typeof lastMessage.content === "string") {
    reason = lastMessage.content.slice(0, 500);
  } else {
    const skillPct = Math.round(scoringOutput.skillMatchScore * 100);
    const matched = scoringOutput.breakdown.matchedSkills.join(", ") || "none";
    reason = `Score: ${scoringOutput.finalScore}. Skill match: ${skillPct}% (${matched}). ${scoringOutput.breakdown.experienceStatus}.`;
  }

  logger.agent("agent_result", {
    finalScore: scoringOutput.finalScore,
    recommended,
    latencyMs,
    version: AGENT_VERSION,
  });

  return {
    recommended,
    score: scoringOutput.finalScore,
    confidence: Math.round(confidence * 100) / 100,
    reason,
    latencyMs,
    version: AGENT_VERSION,
  };
}