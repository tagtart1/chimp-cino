import { dataStore } from "../data/prismaDataStore.js";
import { createAuthService } from "./authService.js";
import { createRouletteService } from "./rouletteService.js";
import { createMinesService } from "./minesService.js";
import { createBlackjackService } from "./blackjackService.js";
import { createAnalyticsService } from "./analyticsService.js";
import { createDailyBonusService } from "./dailyBonusService.js";
import { createAdminService } from "./adminService.js";
import { createAuthorizationService } from "./authorizationService.js";

export const authService = createAuthService(dataStore);
export const rouletteService = createRouletteService(dataStore);
export const minesService = createMinesService(dataStore);
export const blackjackService = createBlackjackService(dataStore);
export const analyticsService = createAnalyticsService(dataStore);
export const dailyBonusService = createDailyBonusService(dataStore);
export const adminService = createAdminService(dataStore);
export const authorizationService = createAuthorizationService(dataStore);
