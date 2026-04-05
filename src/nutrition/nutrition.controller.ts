import { Controller, Post, Get, Patch, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NutritionService } from './nutrition.service';

@UseGuards(AuthGuard('jwt'))
@Controller('nutrition')
export class NutritionController {
  constructor(private nutrition: NutritionService) {}

  @Post('log')
  logFood(
    @Request() req: any,
    @Body() body: {
      foodItemId: string;
      quantityGrams: number;
      mealType: string;
      date: string;
    },
  ) {
    return this.nutrition.logFood(req.user.userId, body);
  }

  @Get('summary')
  getSummary(
    @Request() req: any,
    @Query('date') date: string,
  ) {
    const d = date ?? new Date().toISOString().split('T')[0];
    return this.nutrition.getDailySummary(req.user.userId, d);
  }

  @Patch('targets')
  upsertTarget(
    @Request() req: any,
    @Body() body: {
      caloriesTarget: number;
      proteinTarget: number;
      carbsTarget: number;
      fatsTarget: number;
    },
  ) {
    return this.nutrition.upsertTarget(req.user.userId, body);
  }

  @Post('targets/calculate')
  calculateTargets(@Request() req: any) {
    return this.nutrition.calculateTargets(req.user.userId);
  }

  @Get('foods/search')
  searchFoods(@Query('q') query: string) {
    return this.nutrition.searchFoodItems(query ?? '');
  }
}