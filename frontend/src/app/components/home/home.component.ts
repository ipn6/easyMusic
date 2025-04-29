import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  constructor(private router: Router, private http: HttpClient) {}

  private apiUrl =  environment.apiUrl;

  numClientes: number = 0;
  numCharangas: number = 0;
  numMusicos: number = 0;

  ngOnInit(){
    this.getNumUsuarios();
  }

  goLogin(){
    this.router.navigate(['/login']);
  }

  getNumUsuarios(){
      this.http.get(`${this.apiUrl}/numero_usuarios`).subscribe((res: any) => {
        this.numClientes = res.numClientes;
        this.numCharangas = res.numCharangas;
        this.numMusicos = res.numMusicos;
      }, (err: any) => {
        console.error('Error al obtener el número de usuarios:', err);
      }
    );
  }

  
}
