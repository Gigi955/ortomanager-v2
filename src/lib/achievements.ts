import type { Plant, Task, Harvest, PlantPhoto, Note, GardenLayout } from './db';

export interface Achievement {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  unlocked: boolean;
  progress: number;   // 0–100
}

export interface AchievementsInput {
  plants: Plant[];
  tasks: Task[];
  harvests: Harvest[];
  plantPhotos: PlantPhoto[];
  notes: Note[];
  gardenLayout?: GardenLayout;
}

function pct(value: number, target: number): number {
  return Math.min(100, Math.round((value / target) * 100));
}

export function computeAchievements(input: AchievementsInput): Achievement[] {
  const { plants, tasks, harvests, plantPhotos, notes, gardenLayout } = input;
  const completedTasks = tasks.filter(t => t.completed).length;
  const placedCells = (gardenLayout?.cells ?? []).filter(c => c.plantId).length;

  // Stagioni con piantagioni
  const seasons = new Set<string>();
  plants.forEach(p => {
    const m = new Date(p.plantedDate).getMonth();
    if (m >= 2 && m <= 4) seasons.add('spring');
    else if (m >= 5 && m <= 7) seasons.add('summer');
    else if (m >= 8 && m <= 10) seasons.add('autumn');
    else seasons.add('winter');
  });

  const list: Achievement[] = [
    {
      id: 'first_plant',
      icon: '🌱',
      titleKey: 'achievements.first_plant.title',
      descKey: 'achievements.first_plant.desc',
      unlocked: plants.length >= 1,
      progress: pct(plants.length, 1),
    },
    {
      id: 'green_thumb',
      icon: '🌿',
      titleKey: 'achievements.green_thumb.title',
      descKey: 'achievements.green_thumb.desc',
      unlocked: plants.length >= 10,
      progress: pct(plants.length, 10),
    },
    {
      id: 'first_harvest',
      icon: '🌾',
      titleKey: 'achievements.first_harvest.title',
      descKey: 'achievements.first_harvest.desc',
      unlocked: harvests.length >= 1,
      progress: pct(harvests.length, 1),
    },
    {
      id: 'harvester',
      icon: '🍅',
      titleKey: 'achievements.harvester.title',
      descKey: 'achievements.harvester.desc',
      unlocked: harvests.length >= 10,
      progress: pct(harvests.length, 10),
    },
    {
      id: 'consistency',
      icon: '📅',
      titleKey: 'achievements.consistency.title',
      descKey: 'achievements.consistency.desc',
      unlocked: completedTasks >= 30,
      progress: pct(completedTasks, 30),
    },
    {
      id: 'memoir',
      icon: '📸',
      titleKey: 'achievements.memoir.title',
      descKey: 'achievements.memoir.desc',
      unlocked: plantPhotos.length >= 5,
      progress: pct(plantPhotos.length, 5),
    },
    {
      id: 'planner',
      icon: '🗺️',
      titleKey: 'achievements.planner.title',
      descKey: 'achievements.planner.desc',
      unlocked: placedCells >= 5,
      progress: pct(placedCells, 5),
    },
    {
      id: 'all_seasons',
      icon: '🌍',
      titleKey: 'achievements.all_seasons.title',
      descKey: 'achievements.all_seasons.desc',
      unlocked: seasons.size >= 4,
      progress: pct(seasons.size, 4),
    },
    {
      id: 'diarist',
      icon: '📔',
      titleKey: 'achievements.diarist.title',
      descKey: 'achievements.diarist.desc',
      unlocked: notes.length >= 5,
      progress: pct(notes.length, 5),
    },
  ];

  return list;
}
