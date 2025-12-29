import { apiClient } from "./api-client";
import type { ApiResponse } from "../types";

export interface VocabItem {
  _id: string;
  term: string;
  reading: string;
  meaningVi: string[];
  level: string;
  imageUrl?: string;
  type?: string;
  examples?: Array<{
    sentence: string;
    reading: string;
    meaning: string;
  }>;
  synonyms?: string[];
  antonyms?: string[];
  version: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface KanjiItem {
  _id: string;
  kanji: string;
  hanmean?: string[];
  onyomi?: string[];
  kunyomi?: string[];
  meaningVi: string[];
  compDetail?: Array<{
    h: string;
    w: string;
  }>;
  tips?: string[];
  strokes?: number;
  level: string;
  example_kun?: Record<
    string,
    Array<{
      m: string;
      w: string;
      p: string;
    }>
  >;
  example_on?: Record<
    string,
    Array<{
      m: string;
      w: string;
      p: string;
    }>
  >;
  version: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface GrammarPoint {
  _id: string;
  title: string;
  pattern: string;
  explainVi: string;
  level: string;
  type?: string;
  examples?: Array<{
    content: string;
    transcription: string;
    mean: string;
    segments?: string[];
  }>;
  version: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface CreateVocabItemDto {
  term: string;
  reading: string;
  meaningVi: string[];
  level: string;
  imageUrl?: string;
  type?: string;
  examples?: Array<{
    sentence: string;
    reading: string;
    meaning: string;
  }>;
  synonyms?: string[];
  antonyms?: string[];
}

export interface CreateKanjiItemDto {
  kanji: string;
  hanmean?: string[];
  onyomi?: string[];
  kunyomi?: string[];
  meaningVi: string[];
  compDetail?: Array<{
    h: string;
    w: string;
  }>;
  tips?: string[];
  strokes?: number;
  level: string;
  example_kun?: Record<
    string,
    Array<{
      m: string;
      w: string;
      p: string;
    }>
  >;
  example_on?: Record<
    string,
    Array<{
      m: string;
      w: string;
      p: string;
    }>
  >;
}

export interface CreateGrammarPointDto {
  title: string;
  pattern: string;
  explainVi: string;
  level: string;
  type?: string;
  examples?: Array<{
    content: string;
    transcription: string;
    mean: string;
    segments?: string[];
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const contentApi = {
  // Vocab
  async getVocabItems(params?: {
    page?: number;
    limit?: number;
    level?: string;
    search?: string;
  }): Promise<PaginatedResponse<VocabItem>> {
    // Gửi tất cả params bao gồm page và limit để backend paginate
    const queryParams = new URLSearchParams();
    if (params?.level) queryParams.append("level", params.level);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    // Backend sẽ paginate và trả về items đã được paginate
    const response = await apiClient.get<
      ApiResponse<{ items: VocabItem[]; total: number }>
    >(`/content/vocab?${queryParams.toString()}`);
    const result = response.data;
    const page = params?.page || 1;
    const limit = params?.limit || 20;

    return {
      data: result.items,
      total: result.total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(result.total / limit),
    };
  },

  async getVocabItem(id: string): Promise<VocabItem> {
    const response = await apiClient.get<ApiResponse<VocabItem>>(
      `/content/vocab/${id}`
    );
    return response.data;
  },

  async createVocabItem(data: CreateVocabItemDto): Promise<VocabItem> {
    const response = await apiClient.post<ApiResponse<VocabItem>>(
      "/content/vocab",
      data
    );
    return response.data;
  },

  async updateVocabItem(
    id: string,
    data: Partial<CreateVocabItemDto>
  ): Promise<VocabItem> {
    const response = await apiClient.put<ApiResponse<VocabItem>>(
      `/content/vocab/${id}`,
      data
    );
    return response.data;
  },

  async deleteVocabItem(id: string): Promise<void> {
    await apiClient.delete(`/content/vocab/${id}`);
  },

  async bulkCreateVocabItems(
    items: CreateVocabItemDto[]
  ): Promise<VocabItem[]> {
    const response = await apiClient.post<ApiResponse<VocabItem[]>>(
      "/content/vocab/bulk",
      {
        items,
      }
    );
    return response.data;
  },

  // Kanji
  async getKanjiItems(params?: {
    page?: number;
    limit?: number;
    level?: string;
    search?: string;
  }): Promise<PaginatedResponse<KanjiItem>> {
    // Gửi tất cả params bao gồm page và limit để backend paginate
    const queryParams = new URLSearchParams();
    if (params?.level) queryParams.append("level", params.level);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    // Backend sẽ paginate và trả về items đã được paginate
    const response = await apiClient.get<
      ApiResponse<{ items: KanjiItem[]; total: number }>
    >(`/content/kanji?${queryParams.toString()}`);
    const result = response.data;
    const page = params?.page || 1;
    const limit = params?.limit || 20;

    return {
      data: result.items,
      total: result.total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(result.total / limit),
    };
  },

  async getKanjiItem(id: string): Promise<KanjiItem> {
    const response = await apiClient.get<ApiResponse<KanjiItem>>(
      `/content/kanji/${id}`
    );
    return response.data;
  },

  async createKanjiItem(data: CreateKanjiItemDto): Promise<KanjiItem> {
    const response = await apiClient.post<ApiResponse<KanjiItem>>(
      "/content/kanji",
      data
    );
    return response.data;
  },

  async updateKanjiItem(
    id: string,
    data: Partial<CreateKanjiItemDto>
  ): Promise<KanjiItem> {
    const response = await apiClient.put<ApiResponse<KanjiItem>>(
      `/content/kanji/${id}`,
      data
    );
    return response.data;
  },

  async deleteKanjiItem(id: string): Promise<void> {
    await apiClient.delete(`/content/kanji/${id}`);
  },

  async bulkCreateKanjiItems(
    items: CreateKanjiItemDto[]
  ): Promise<KanjiItem[]> {
    const response = await apiClient.post<ApiResponse<KanjiItem[]>>(
      "/content/kanji/bulk",
      {
        items,
      }
    );
    return response.data;
  },

  // Grammar
  async getGrammarPoints(params?: {
    page?: number;
    limit?: number;
    level?: string;
    search?: string;
  }): Promise<PaginatedResponse<GrammarPoint>> {
    // Gửi tất cả params bao gồm page và limit để backend paginate
    const queryParams = new URLSearchParams();
    if (params?.level) queryParams.append("level", params.level);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    // Backend sẽ paginate và trả về items đã được paginate
    const response = await apiClient.get<
      ApiResponse<{ items: GrammarPoint[]; total: number }>
    >(`/content/grammar?${queryParams.toString()}`);
    const result = response.data;
    const page = params?.page || 1;
    const limit = params?.limit || 20;

    return {
      data: result.items,
      total: result.total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(result.total / limit),
    };
  },

  async getGrammarPoint(id: string): Promise<GrammarPoint> {
    const response = await apiClient.get<ApiResponse<GrammarPoint>>(
      `/content/grammar/${id}`
    );
    return response.data;
  },

  async createGrammarPoint(data: CreateGrammarPointDto): Promise<GrammarPoint> {
    const response = await apiClient.post<ApiResponse<GrammarPoint>>(
      "/content/grammar",
      data
    );
    return response.data;
  },

  async updateGrammarPoint(
    id: string,
    data: Partial<CreateGrammarPointDto>
  ): Promise<GrammarPoint> {
    const response = await apiClient.put<ApiResponse<GrammarPoint>>(
      `/content/grammar/${id}`,
      data
    );
    return response.data;
  },

  async deleteGrammarPoint(id: string): Promise<void> {
    await apiClient.delete(`/content/grammar/${id}`);
  },

  async bulkCreateGrammarPoints(
    items: CreateGrammarPointDto[]
  ): Promise<GrammarPoint[]> {
    const response = await apiClient.post<ApiResponse<GrammarPoint[]>>(
      "/content/grammar/bulk",
      {
        items,
      }
    );
    return response.data;
  },
};
