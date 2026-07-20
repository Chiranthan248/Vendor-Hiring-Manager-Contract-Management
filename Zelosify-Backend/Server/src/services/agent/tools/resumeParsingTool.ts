import { AwsStorageService } from "../../storage/aws/awsStorageService.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");


const storage = new AwsStorageService();

export interface ParsedResume {
  experienceYears: number;
  skills: string[];
  normalizedSkills: string[];
  location: string;
  education: string[];
  keywords: string[];
  rawText: string;
}

function sanitizeText(text: string): string {
  // Prevent prompt injection - remove any instruction-like patterns
  return text
    .replace(/ignore previous instructions/gi, "")
    .replace(/system prompt/gi, "")
    .replace(/you are now/gi, "")
    .replace(/\[INST\]/gi, "")
    .replace(/<<SYS>>/gi, "")
    .slice(0, 8000); // Limit size
}

function extractYearsOfExperience(text: string): number {
  const patterns = [
    /(\d+)\+?\s*years?\s*of\s*experience/gi,
    /experience\s*:?\s*(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*yrs?\s*of\s*exp/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      return parseInt(match[1]);
    }
  }

  // Count year ranges like "2019 - 2023"
  const yearRanges = text.match(/20\d{2}\s*[-–]\s*(20\d{2}|present|current)/gi);
  if (yearRanges && yearRanges.length > 0) {
    return Math.min(yearRanges.length * 2, 15);
  }

  return 0;
}

function extractLocation(text: string): string {
  const locationPatterns = [
    /location\s*:?\s*([^\n,]+)/i,
    /address\s*:?\s*([^\n,]+)/i,
    /(bangalore|mumbai|delhi|hyderabad|pune|chennai|remote|new york|london)/i,
  ];

  for (const pattern of locationPatterns) {
    const match = pattern.exec(text);
    if (match) return match[1].trim();
  }
  return "Unknown";
}

function extractEducation(text: string): string[] {
  const education: string[] = [];
  const patterns = [
    /b\.?tech|bachelor of technology/gi,
    /m\.?tech|master of technology/gi,
    /b\.?e\.?|bachelor of engineering/gi,
    /m\.?s\.?|master of science/gi,
    /b\.?sc|bachelor of science/gi,
    /mba|master of business/gi,
    /ph\.?d/gi,
  ];

  for (const pattern of patterns) {
    if (pattern.test(text)) {
      education.push(pattern.source.split("|")[0].replace(/\\/g, ""));
    }
  }
  return education.length > 0 ? education : ["Not specified"];
}

export async function resumeParsingTool(s3Key: string): Promise<ParsedResume> {
  console.log(`[ResumeParseTool] Fetching file: ${s3Key}`);

  const stream = await storage.getObjectStream(s3Key);

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);

  let rawText = "";

  if (s3Key.endsWith(".pdf")) {
    const parsed = await pdfParse(buffer);
    rawText = parsed.text;
  } else {
    rawText = buffer.toString("utf-8");
  }

  const sanitized = sanitizeText(rawText);

  return {
    experienceYears: extractYearsOfExperience(sanitized),
    skills: [],
    normalizedSkills: [],
    location: extractLocation(sanitized),
    education: extractEducation(sanitized),
    keywords: [],
    rawText: sanitized,
  };
}