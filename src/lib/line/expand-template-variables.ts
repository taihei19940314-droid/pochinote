export interface TemplateVariables {
  customerName: string;
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
    .replace(/\{顧客名\}/g, values.customerName)
    .replace(/\{サロン名\}/g, values.salonName)
    .replace(/\{日付\}/g, values.date)
    .replace(/\{時刻\}/g, values.time)
    .replace(/\{日数\}/g, String(values.daysSinceLastVisit));
}
