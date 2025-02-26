import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})

export class NavbarComponent implements OnInit {
  user: any = null;
  rol: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {

    this.authService.user$.subscribe(user => {
      console.log("Usuario actualizado en la navbar:", user);
      this.user = user;
      this.rol = user ? user.rol : '';
    });
  }

  loadUser() {
    this.user = this.authService.getUser();
    
  }

  logout() {
    this.authService.logout();
    this.user = null; // Limpiar usuario
    this.router.navigate(['/login']); // Redirigir al login
  }
}
