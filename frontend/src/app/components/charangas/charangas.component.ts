import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Provincia {
  idProvincia: number;
  nombre: string;
}


@Component({
  selector: 'app-charangas',
  templateUrl: './charangas.component.html',
  styleUrl: './charangas.component.css'
})
export class CharangasComponent {
  user: any = {};
  anuncios: any[] = []; // Todos los anuncios
  anunciosFiltrados: any[] = []; // Anuncios después del filtro
  provincias: Provincia[] = [];
  filtroProvincia: string = '';
  fechaInicioFiltro: string = '';
  fechaFinFiltro: string = '';
  nuevoAnuncio = { titulo: '', descripcion: '', idProvincia: '', fechaInicio: new Date().toISOString().split('T')[0], fechaFin: new Date().toISOString().split('T')[0] };
  mostrarFormulario: boolean = false;


  private apiUrl =  environment.apiUrl;

   constructor(private authService: AuthService, private http: HttpClient) {}
  
    ngOnInit() {
      this.user = this.authService.getUser();
      this.obtenerAnuncios();
      this.obtenerProvincias();
      const hoy = new Date().toISOString().split('T')[0];
      this.fechaInicioFiltro = hoy;
      const dentroDeUnMes = new Date();
      dentroDeUnMes.setMonth(dentroDeUnMes.getMonth() + 1);
      this.fechaFinFiltro = dentroDeUnMes.toISOString().split('T')[0];
    }

    obtenerAnuncios() {

      let params: any = {};
  
      if (this.filtroProvincia) {
        params.idProvincia = this.filtroProvincia;
      }
      if (this.fechaInicioFiltro) {
        params.fechaInicio = this.fechaInicioFiltro || new Date().toISOString().split('T')[0]
      }
      if (this.fechaFinFiltro) {
        params.fechaFin = this.fechaFinFiltro;
      }
      this.http.get<any[]>(`${this.apiUrl}/anuncios_charangas`, { params }).subscribe(
        (data) => {
          console.log("Anuncios recibidos después de aplicar filtro:", data);
          this.anunciosFiltrados = data;
        },
        (error) => {
          console.error("Error al obtener anuncios:", error);
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

    crearAnuncio() {
      const anuncioData = { ...this.nuevoAnuncio, idUsuario: this.user.idUsuario };
      this.http.post(`${this.apiUrl}/crear_anuncio_charanga`, anuncioData).subscribe(() => {
        this.obtenerAnuncios();
        this.nuevoAnuncio = { titulo: '', descripcion: '', idProvincia: '', fechaInicio: '', fechaFin: '' };
      });
    }

    getFotoUrl(id: number): string {
      return `${this.apiUrl}/usuario/${id}/foto`; 
    }
}
