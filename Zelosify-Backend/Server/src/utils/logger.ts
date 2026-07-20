export const logger = {
  info: (event: string, data?: object) => {
    console.log(JSON.stringify({
      level: "INFO",
      timestamp: new Date().toISOString(),
      event,
      ...data,
    }));
  },
  error: (event: string, error: any, data?: object) => {
    console.log(JSON.stringify({
      level: "ERROR",
      timestamp: new Date().toISOString(),
      event,
      error: error?.message || String(error),
      ...data,
    }));
  },
  agent: (event: string, data?: object) => {
    console.log(JSON.stringify({
      level: "AGENT",
      timestamp: new Date().toISOString(),
      event,
      ...data,
    }));
  },
};