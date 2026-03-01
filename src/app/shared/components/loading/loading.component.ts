import { Component, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],})
export class LoadingComponent {
  @Input() diameter = 40;
  @Input() message?: string;
  @Input({ transform: booleanAttribute }) overlay = false;
  @Input({ transform: booleanAttribute }) fullscreen = false;
}


