"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBudgets = exports.addBudget = void 0;
const firebaseConfig_1 = require("../firebaseConfig");
const addBudget = (budget) => __awaiter(void 0, void 0, void 0, function* () {
    yield firebaseConfig_1.db.collection("budgets").add(budget);
});
exports.addBudget = addBudget;
const getBudgets = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const querySnapshot = yield firebaseConfig_1.db.collection("budgets").where("userId", "==", userId).get();
    return querySnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
});
exports.getBudgets = getBudgets;
