import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ariary',
  standalone: true
})
export class AriaryPipe implements PipeTransform {
  transform(value: number | null | undefined, showSymbol: boolean = true): string {
    if (value === null || value === undefined) {
      return showSymbol ? '0 Ar' : '0';
    }

    // Format number with spaces as thousand separator (French style)
    const formatted = Math.round(value).toLocaleString('fr-FR');

    return showSymbol ? `${formatted} Ar` : formatted;
  }
}
