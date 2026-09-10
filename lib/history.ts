import { prisma } from "@/lib/prisma";
import { sessionVisibilityWhere } from "@/lib/study-access";

export function getMySubmissions(userId: string, roles: readonly string[] = []) {
  return prisma.submission.findMany({
    where: { userId, status: "submitted", formDef: { session: { status: "closed", ...sessionVisibilityWhere({roles}) } } },
    orderBy: [{ formDef: { session: { date: "asc" } } }, { submittedAt: "asc" }],
    include: { answers: true, formDef: { include: { fields: { orderBy: { order: "asc" } }, session: {include:{study:true}} } } },
  });
}

export function getClosedSessionResults(studyId?:string) {
  return prisma.studySession.findMany({
    where: { status: "closed", ...(studyId?{studyId}:{}) }, orderBy: [{ date: "asc" }, { weekNo: "asc" }],
    include: {
      study: true,
      recordingParts: {select:{durationMs:true,uploadedAt:true}},
      attendances: { include: { user: { select: { id: true, name: true, email: true } } } },
      formDef: { include: { submissions: {
        select: { userId: true, status: true, submittedAt: true, user: { select: { id: true, name: true, email: true } } },
      } } },
    },
  });
}

export const sessionTitle = (weekNo: number) => weekNo === 0 ? "리허설" : `${weekNo}주차`;
export function formatDate(date: Date | null) {
  return date ? date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }) : "—";
}
export function elapsedSeconds(start: Date | null, end: Date | null) {
  if (!start || !end || end < start) return null;
  return Math.floor((end.getTime() - start.getTime()) / 1000);
}
export function duration(seconds: number) {
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
}
