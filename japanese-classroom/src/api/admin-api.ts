import { apiClient } from "./api-client";
import type { ApiResponse } from "../types";

export interface LimitLearningSettings {
	limits: {
		vocab: number;
		kanji: number;
		grammar: number;
	};
	isActive: boolean;
	updatedAt?: string;
}

export interface UpdateLimitLearningDto {
	vocab?: number;
	kanji?: number;
	grammar?: number;
	isActive?: boolean;
}

export const adminApi = {
	async getLimitLearning(): Promise<LimitLearningSettings> {
		const response = await apiClient.get<ApiResponse<LimitLearningSettings>>(
			"/admin/settings/limit-learning"
		);
		return response.data;
	},

	async updateLimitLearning(
		data: UpdateLimitLearningDto
	): Promise<LimitLearningSettings> {
		const response = await apiClient.put<ApiResponse<LimitLearningSettings>>(
			"/admin/settings/limit-learning",
			data
		);
		return response.data;
	},
};

