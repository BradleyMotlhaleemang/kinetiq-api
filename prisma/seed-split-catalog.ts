import { PrismaClient, TrainingGoal } from '@prisma/client'
import { splitTemplates, type SplitTemplate } from './data/split-template-catalog'

function deriveSplitType(slug: string): string {
  if (slug.startsWith('full-body')) return 'FULL_BODY'
  if (slug.startsWith('upper-lower') || slug === 'strength-4x') return 'UPPER_LOWER'
  if (slug === 'ppl-3x' || slug === 'ppl-6x') return 'PPL'
  if (slug === 'ppl-upper-lower-5x' || slug === 'high-frequency-6x') return 'HYBRID'
  if (slug === 'bro-split-5x') return 'BODY_PART'
  return 'FULL_BODY'
}

function derivePrimaryMuscle(splitType: string): string {
  if (splitType === 'PPL') return 'Push'
  if (splitType === 'UPPER_LOWER') return 'Upper'
  if (splitType === 'FULL_BODY') return 'Full Body'
  if (splitType === 'BODY_PART') return 'Balanced'
  if (splitType === 'HYBRID') return 'Balanced'
  return 'Balanced'
}

function mapCatalogGoal(goal: SplitTemplate['goal']): TrainingGoal {
  if (goal === 'STRENGTH') return 'STRENGTH'
  if (goal === 'HYPERTROPHY') return 'HYPERTROPHY'
  return 'HYPERTROPHY'
}

function collectExerciseNames(catalog: SplitTemplate[]): string[] {
  const names = new Set<string>()
  for (const tpl of catalog) {
    for (const day of tpl.days) {
      if (day.type !== 'WORKOUT' || !day.exercises) continue
      for (const ex of day.exercises) {
        names.add(ex.name)
      }
    }
  }
  return Array.from(names)
}

export async function seedSplitCatalog(prisma: PrismaClient): Promise<void> {
  const exerciseNames = collectExerciseNames(splitTemplates)
  const exercises = await prisma.exercise.findMany({
    where: { name: { in: exerciseNames } },
    select: { id: true, name: true },
  })
  const exerciseIdByName = new Map(exercises.map((e) => [e.name, e.id]))
  const missing = exerciseNames.filter((name) => !exerciseIdByName.has(name))
  if (missing.length > 0) {
    throw new Error(`Missing catalog exercises: ${missing.join(', ')}`)
  }

  for (const tpl of splitTemplates) {
    const splitType = deriveSplitType(tpl.slug)
    const primaryMuscle = derivePrimaryMuscle(splitType)
    const goal = mapCatalogGoal(tpl.goal)
    const goalTags = tpl.goalTags.map((tag) =>
      tag === 'RECOMPOSITION' ? 'RECOMPOSITION' : tag,
    )

    const template = await prisma.splitTemplate.upsert({
      where: { slug: tpl.slug },
      update: {
        name: tpl.name,
        level: tpl.level,
        goal,
        primaryMuscle,
        isSystem: true,
        splitLabel: tpl.name,
        splitType,
        daysPerWeek: tpl.daysPerWeek,
        description: tpl.description,
        goalTags,
        experienceTags: [...tpl.experienceTags],
      },
      create: {
        slug: tpl.slug,
        name: tpl.name,
        level: tpl.level,
        goal,
        primaryMuscle,
        isSystem: true,
        splitLabel: tpl.name,
        splitType,
        daysPerWeek: tpl.daysPerWeek,
        description: tpl.description,
        goalTags,
        experienceTags: [...tpl.experienceTags],
      },
    })

    const existingDays = await prisma.splitDay.findMany({
      where: { splitTemplateId: template.id },
      select: { id: true },
    })
    const existingDayIds = existingDays.map((d) => d.id)
    if (existingDayIds.length > 0) {
      await prisma.splitDayExercise.deleteMany({
        where: { splitDayId: { in: existingDayIds } },
      })
    }
    await prisma.splitDay.deleteMany({
      where: { splitTemplateId: template.id },
    })

    await prisma.splitTemplate.update({
      where: { id: template.id },
      data: {
        days: {
          create: tpl.days.map((day, index) => ({
            dayNumber: index + 1,
            dayType: day.type,
            label: day.label,
            ...(day.type === 'WORKOUT' && day.exercises
              ? {
                  exercises: {
                    create: day.exercises.map((exercise) => ({
                      exerciseId: exerciseIdByName.get(exercise.name)!,
                      orderIndex: exercise.orderIndex + 1,
                      setsTarget: exercise.setsTarget,
                      repRangeMin: exercise.repRangeMin,
                      repRangeMax: exercise.repRangeMax,
                    })),
                  },
                }
              : {}),
          })),
        },
      },
    })

    console.log(`Seeded split catalog: ${tpl.name} (${tpl.slug})`)
  }
}
