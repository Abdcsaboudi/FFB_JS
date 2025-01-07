import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { JsonUploadComponent } from './features/json-upload/json-upload.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, JsonUploadComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'ffb-angular-app';
}
