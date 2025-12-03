import { apiClient } from "./api-client";
import type { ApiResponse } from "../types";

export interface CheckInResponse {
	dateKey: string;
	limits: {
		vocab: number;
		kanji: number;
		grammar: number;
	};
	used: {
		vocab: number;
		kanji: number;
		grammar: number;
	};
	assigned: {
		vocabIds: string[];
		kanjiIds: string[];
		grammarIds: string[];
	};
	checkedInAt: string;
}

export interface DailyStateResponse {
	limits: {
		vocab: number;
		kanji: number;
		grammar: number;
	};
	used: {
		vocab: number;
		kanji: number;
		grammar: number;
	};
	assigned: {
		vocabIds: string[];
		kanjiIds: string[];
		grammarIds: string[];
	};
	checkedInAt: string | null;
}

export const attendanceApi = {
	async checkIn(): Promise<CheckInResponse> {
		const response = await apiClient.post<ApiResponse<CheckInResponse>>(
			"/attendance/check-in"
		);
		return response.data;
	},

	async getStatus(dateKey?: string): Promise<DailyStateResponse | null> {
		const params = dateKey ? `?dateKey=${dateKey}` : "";
		const response = await apiClient.get<ApiResponse<DailyStateResponse>>(
			`/attendance/status${params}`
		);
		return response.data;
	},
};

