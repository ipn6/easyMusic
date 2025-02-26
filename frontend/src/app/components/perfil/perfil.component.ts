import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  user: any = {};

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUser();
  }

  loadUser() {
    this.user = this.authService.getUser();
  }
}
