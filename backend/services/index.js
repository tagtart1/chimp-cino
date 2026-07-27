import { dataStore } from "../data/prismaDataStore.js";
import { createAuthService } from "./authService.js";
import { createRouletteService } from "./rouletteService.js";
import { createMinesService } from "./minesService.js";
import { createBlackjackService } from "./blackjackService.js";

export const authService = createAuthService(dataStore);
export const rouletteService = createRouletteService(dataStore);
export const minesService = createMinesService(dataStore);
export const blackjackService = createBlackjackService(dataStore);
