export interface IpCount {
  ip: string;
  count: number;
  percentage: number;
}

export interface AnalysisResult {
  totalRequests: number;
  processingTimeMs: number;
  topIps: IpCount[];
}
