import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  user = { name: '', email: '', password: '', confirmPassword: '', telefono: '', rol: 'cliente' };

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.authService.register(this.user).subscribe(res => {
      alert("Usuario registrado con éxito");
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      this.router.navigate(['/perfil']);
    }, err => alert("Error en el registro"));
  }
}
