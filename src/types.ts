
export type AgentStatus = 'idle' | 'running' | 'completed' | 'error';

export interface BlogState {
  title: string;
  topic: string;
  relatedTopics: string[];
  currentAgent: number;
  agentData: {
    trends: string;
    keywords: string[];
    titles: string[];
    selectedTitle: string;
    content: string;
    seo: {
      score: number;
      description: string;
      tags: string[];
    };
    performance: {
      reach: string;
      guide: string;
    };
  };
}

export const INITIAL_STATE: BlogState = {
  title: '',
  topic: '',
  relatedTopics: [],
  currentAgent: -1,
  agentData: {
    trends: '',
    keywords: [],
    titles: [],
    selectedTitle: '',
    content: '',
    seo: {
      score: 0,
      description: '',
      tags: [],
    },
    performance: {
      reach: '',
      guide: '',
    },
  },
};
