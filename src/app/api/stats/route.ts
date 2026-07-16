import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const [projectCount, branchCount, apiKeyCount, activityCount] = await Promise.all([
    db.project.count({ where: { userId: user.id } }),
    db.branch.count({ where: { project: { userId: user.id } } }),
    db.apiKey.count({ where: { userId: user.id } }),
    db.activityLog.count({ where: { userId: user.id } }),
  ]);

  // Mock compute time (hours) - in a real product this would come from metrics
  const computeHours = (projectCount * 24 * 0.1).toFixed(1);
  const storageMB = (projectCount * 156).toFixed(0);

  return NextResponse.json({
    stats: {
      projects: projectCount,
      branches: branchCount,
      apiKeys: apiKeyCount,
      activities: activityCount,
      computeHours,
      storageMB,
    },
  });
}
