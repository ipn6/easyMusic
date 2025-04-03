import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';


interface Provincia {
  idProvincia: number;
  nombre: string;
}

@Component({
  selector: 'app-ofertas',
  templateUrl: './ofertas.component.html',
  styleUrl: './ofertas.component.css'
})
export class OfertasComponent {
  user: any = {};
  provincias:  Provincia[] = [];
  filtroProvincia: string = '';
  ofertas: any[] = []; // Todos las ofertas
  ofertasFiltradas: any[] = []; // Ofertas después del filtro
  nuevaOferta = { nombre: '', descripcion: '', idCliente:'', idCharanga:'', idProvincia: '', fechaInicio: '', 
    fechaFin: '', direccion: '', tipo: '', contratada: '', valoracionCliente: '', valoracionCharanga: '' };
  private apiUrl =  environment.apiUrl;

  constructor(private authService: AuthService, private http: HttpClient) {}
    
  ngOnInit() {
    this.user = this.authService.getUser();
    this.obtenerProvincias();
  }

  obtenerProvincias() {
    this.http.get<Provincia[]>(`${this.apiUrl}/provincias`).subscribe(
      (data) => {
        this.provincias = data;
      },
      (error) => console.error('Error al cargar provincias', error)
    );
  }

  obtenerOfertas() {
    let params: any = {};
    if (this.filtroProvincia) {
      params.idProvincia = this.filtroProvincia;
    }
    this.http.get<any[]>(`${this.apiUrl}/ofertas`, { params }).subscribe(
      (data) => {
        console.log("Ofertas recibidas después de aplicar filtro:", data);
        this.ofertasFiltradas = data;
      },
      (error) => {
        console.error("Error al obtener ofertas:", error);
      }
    );
  }

  crearOferta() {
    const ofertaData = { ...this.nuevaOferta, idCliente: this.user.idUsuario };
    this.http.post(`${this.apiUrl}/crear_oferta`, ofertaData).subscribe(() => {
      this.obtenerOfertas();
      this.nuevaOferta = { nombre: '', descripcion: '', idCliente:'', idCharanga:'', idProvincia: '', fechaInicio: '', 
        fechaFin: '', direccion: '', tipo: '', contratada: '', valoracionCliente: '', valoracionCharanga: '' };
    });
  }
}
