import { dataStore } from "../data/prismaDataStore.js";
import { createAuthService } from "./authService.js";
import { createRouletteService } from "./rouletteService.js";
import { createMinesService } from "./minesService.js";
import { createBlackjackService } from "./blackjackService.js";
import { createAnalyticsService } from "./analyticsService.js";
import { createDailyBonusService } from "./dailyBonusService.js";

export const authService = createAuthService(dataStore);
export const rouletteService = createRouletteService(dataStore);
export const minesService = createMinesService(dataStore);
export const blackjackService = createBlackjackService(dataStore);
export const analyticsService = createAnalyticsService(dataStore);
export const dailyBonusService = createDailyBonusService(dataStore);
