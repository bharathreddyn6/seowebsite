// Minimal in-memory storage stub to satisfy imports
export const storage = {
  getUser: async (id: string) => undefined,
  getUserByUsername: async (u: string) => undefined,
  createUser: async (u: any) => (u),
  getWebsiteAnalysis: async (id: string) => undefined,
  getWebsiteAnalysesByUrl: async (url: string) => [],
  createWebsiteAnalysis: async (analysis: any) => analysis,
  getRecentAnalyses: async (limit = 10) => [],
  createRankingHistory: async (h: any) => h,
};

export default storage;
