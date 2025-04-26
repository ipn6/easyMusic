import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  showPassword = false;
  

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.authService.login(this.credentials).subscribe(res => {
      alert("Login correcto");
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      this.router.navigate(['/perfil']);
    }, err => alert("Credenciales incorrectas"));
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goRegister(){
    this.router.navigate(['/register']);
  }

}