import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouteTrackingService } from './core/services/route-tracking.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet],
  standalone: true
})
export class AppComponent {
  title = 'Vivento';

  constructor(private routeTrackingService: RouteTrackingService) {
    // The service will automatically start tracking when injected
    // No need to call any methods - it's all automatic
  }
}
