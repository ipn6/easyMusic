import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface Provincia {
  idProvincia: number;
  nombre: string;
}
@Component({
  selector: 'app-listado-charangas',
  templateUrl: './listado-charangas.component.html',
  styleUrl: './listado-charangas.component.css'
})
export class ListadoCharangasComponent {
  charangas: any[] = [];
  charangasFiltradas: any[] = [];
  user: any = {};
  provincias:  Provincia[] = [];
  filtroProvincia: string = '';
  private apiUrl =  environment.apiUrl;

  constructor(private authService: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    this.obtenerCharangas();
    this.obtenerProvincias();
  }

  obtenerCharangas() {
    let params: any = {};
  
    if (this.filtroProvincia) {
        params.idProvincia = this.filtroProvincia;
    }

    this.http.get<any[]>(`${this.apiUrl}/charangas`, { params }).subscribe(
      (data) => {

        this.charangasFiltradas = data;
      },
      (error) => {
        console.error("Error al obtener charangas:", error);
      }
    );
  }

  obtenerProvincias() {
    this.http.get<Provincia[]>(`${this.apiUrl}/provincias`).subscribe(
      (data) => {
        this.provincias = data;
      },
      (error) => console.error('Error al cargar provincias', error)
    );
  }

}
