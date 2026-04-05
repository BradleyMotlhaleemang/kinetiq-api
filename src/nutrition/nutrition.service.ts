import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NutritionService {
  constructor(private prisma: PrismaService) {}

  async logFood(
    userId: string,
    data: {
      foodItemId: string;
      quantityGrams: number;
      mealType: string;
      date: string;
    },
  ) {
    const foodItem = await this.prisma.foodItem.findUnique({
      where: { id: data.foodItemId },
    });

    if (!foodItem) throw new Error('Food item not found');

    const factor = data.quantityGrams / 100;

    return this.prisma.foodLog.create({
      data: {
        userId,
        date: new Date(data.date),
        mealType: data.mealType,
        foodItemId: data.foodItemId,
        quantityGrams: data.quantityGrams,
        caloriesConsumed: foodItem.caloriesPer100g * factor,
        proteinConsumed: foodItem.proteinPer100g * factor,
        carbsConsumed: foodItem.carbsPer100g * factor,
        fatsConsumed: foodItem.fatPer100g * factor,
      },
    });
  }

  async getDailySummary(userId: string, date: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const logs = await this.prisma.foodLog.findMany({
      where: { userId, date: { gte: start, lte: end } },
      include: { foodItem: true },
    });

    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.caloriesConsumed,
        protein: acc.protein + log.proteinConsumed,
        carbs: acc.carbs + log.carbsConsumed,
        fats: acc.fats + log.fatsConsumed,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 },
    );

    const target = await this.prisma.nutritionTarget.findUnique({
      where: { userId },
    });

    return { date, totals, target, logs };
  }

  async getYesterdaysSummary(userId: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    const summary = await this.getDailySummary(userId, dateStr);

    const target = await this.prisma.nutritionTarget.findUnique({
      where: { userId },
    });

    if (!target) return null;

    const proteinPct = summary.totals.protein / target.proteinTarget;
    const calorieDelta = summary.totals.calories - target.caloriesTarget;

    let nutritionScore: number;
    if (proteinPct >= 0.85 && calorieDelta > -500) nutritionScore = 4;
    else if (proteinPct >= 0.6) nutritionScore = 3;
    else nutritionScore = 2;

    if (calorieDelta < -500) nutritionScore = Math.min(nutritionScore, 3);

    return { proteinPct, calorieDelta, nutritionScore };
  }

  async upsertTarget(
    userId: string,
    data: {
      caloriesTarget: number;
      proteinTarget: number;
      carbsTarget: number;
      fatsTarget: number;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    return this.prisma.nutritionTarget.upsert({
      where: { userId },
      update: {
        ...data,
        calculatedFromWeightKg: user?.bodyweightKg ?? 0,
        lastCalculatedAt: new Date(),
      },
      create: {
        userId,
        ...data,
        calculatedFromWeightKg: user?.bodyweightKg ?? 0,
      },
    });
  }

  async calculateTargets(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.bodyweightKg) return null;

    const proteinMultiplier =
      user.goalMode === 'MUSCLE_GAIN' ? 2.2
      : user.goalMode === 'STRENGTH' ? 2.0
      : user.goalMode === 'WEIGHT_LOSS' ? 2.4
      : 1.8;

    const proteinTarget = user.bodyweightKg * proteinMultiplier;
    const caloriesTarget =
      user.goalMode === 'WEIGHT_LOSS'
        ? user.bodyweightKg * 28
        : user.bodyweightKg * 33;
    const carbsTarget = (caloriesTarget * 0.4) / 4;
    const fatsTarget = (caloriesTarget * 0.25) / 9;

    return this.upsertTarget(userId, {
      caloriesTarget,
      proteinTarget,
      carbsTarget,
      fatsTarget,
    });
  }

  async searchFoodItems(query: string) {
    return this.prisma.foodItem.findMany({
      where: { name: { contains: query } },
      take: 20,
    });
  }
}