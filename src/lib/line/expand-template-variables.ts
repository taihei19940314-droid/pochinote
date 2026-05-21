export interface TemplateVariables {
  petName: string;
  salonName: string;
  date: string;
  time: string;
  daysSinceLastVisit: number;
}

export function expandTemplateVariables(
  template: string,
  values: TemplateVariables
): string {
  return template
    .replace(/\{ペット名\}/g, values.petName)
    .replace(/\{サロン名\}/g, values.salonName)
    .replace(/\{日付\}/g, values.date)
    .replace(/\{時刻\}/g, values.time)
    .replace(/\{日数\}/g, String(values.daysSinceLastVisit));
}
