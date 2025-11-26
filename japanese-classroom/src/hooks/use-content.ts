import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  contentApi,
  type CreateVocabItemDto,
  type CreateKanjiItemDto,
  type CreateGrammarPointDto,
} from "../api/content-api";

type ContentType = "vocab" | "kanji" | "grammar";

interface UseContentParams {
  type: ContentType;
  page?: number;
  limit?: number;
  level?: string;
  search?: string;
  enabled?: boolean;
}

export function useContent(params: UseContentParams) {
  const { type, page = 1, limit = 20, level, search, enabled = true } = params;

  const queryKey = [
    "content",
    type,
    { page, limit, level: level || undefined, search: search || undefined },
  ] as const;

  const queryFn = async () => {
    if (type === "vocab") {
      return await contentApi.getVocabItems({
        page,
        limit,
        level: level || undefined,
        search: search || undefined,
      });
    } else if (type === "kanji") {
      return await contentApi.getKanjiItems({
        page,
        limit,
        level: level || undefined,
        search: search || undefined,
      });
    } else {
      return await contentApi.getGrammarPoints({
        page,
        limit,
        level: level || undefined,
        search: search || undefined,
      });
    }
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled,
  });
}

export function useContentItem(
  type: ContentType,
  id: string | null,
  enabled = true
) {
  const queryKey = ["content", type, id] as const;

  const queryFn = async () => {
    if (!id) return null;
    if (type === "vocab") {
      return await contentApi.getVocabItem(id);
    } else if (type === "kanji") {
      return await contentApi.getKanjiItem(id);
    } else {
      return await contentApi.getGrammarPoint(id);
    }
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: enabled && !!id,
  });
}

export function useCreateContent(type: ContentType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateVocabItemDto | CreateKanjiItemDto | CreateGrammarPointDto
    ) => {
      if (type === "vocab") {
        return await contentApi.createVocabItem(data as CreateVocabItemDto);
      } else if (type === "kanji") {
        return await contentApi.createKanjiItem(data as CreateKanjiItemDto);
      } else {
        return await contentApi.createGrammarPoint(
          data as CreateGrammarPointDto
        );
      }
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách content
      queryClient.invalidateQueries({ queryKey: ["content", type] });
    },
  });
}

export function useUpdateContent(type: ContentType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data:
        | Partial<CreateVocabItemDto>
        | Partial<CreateKanjiItemDto>
        | Partial<CreateGrammarPointDto>;
    }) => {
      if (type === "vocab") {
        return await contentApi.updateVocabItem(
          id,
          data as Partial<CreateVocabItemDto>
        );
      } else if (type === "kanji") {
        return await contentApi.updateKanjiItem(
          id,
          data as Partial<CreateKanjiItemDto>
        );
      } else {
        return await contentApi.updateGrammarPoint(
          id,
          data as Partial<CreateGrammarPointDto>
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate cả danh sách và item cụ thể
      queryClient.invalidateQueries({ queryKey: ["content", type] });
      queryClient.invalidateQueries({
        queryKey: ["content", type, variables.id],
      });
    },
  });
}

export function useDeleteContent(type: ContentType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (type === "vocab") {
        return await contentApi.deleteVocabItem(id);
      } else if (type === "kanji") {
        return await contentApi.deleteKanjiItem(id);
      } else {
        return await contentApi.deleteGrammarPoint(id);
      }
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách content
      queryClient.invalidateQueries({ queryKey: ["content", type] });
    },
  });
}

export function useBulkCreateContent(type: ContentType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      items:
        | CreateVocabItemDto[]
        | CreateKanjiItemDto[]
        | CreateGrammarPointDto[]
    ) => {
      if (type === "vocab") {
        return await contentApi.bulkCreateVocabItems(
          items as CreateVocabItemDto[]
        );
      } else if (type === "kanji") {
        return await contentApi.bulkCreateKanjiItems(
          items as CreateKanjiItemDto[]
        );
      } else {
        return await contentApi.bulkCreateGrammarPoints(
          items as CreateGrammarPointDto[]
        );
      }
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách content
      queryClient.invalidateQueries({ queryKey: ["content", type] });
    },
  });
}
