import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
  showCookiesBanner = true;

  constructor( private router: Router) {}

  acceptCookies() {
    this.showCookiesBanner = false;
    localStorage.setItem('cookiesAccepted', 'true');
  }

  ngOnInit() {
    if (localStorage.getItem('cookiesAccepted')) {
      this.showCookiesBanner = false;
    }
  }

  goDatos(){
      this.router.navigate(['/tratamiento-datos']);
    }
}
