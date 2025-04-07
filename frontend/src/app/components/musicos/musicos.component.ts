import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Provincia {
  idProvincia: number;
  nombre: string;
}

interface Instrumento{
  idInstrumento: number;
  nombre: string;
}

@Component({
  selector: 'app-musicos',
  templateUrl: './musicos.component.html',
  styleUrl: './musicos.component.css'
})
export class MusicosComponent {
  user: any = {};
  anuncios: any[] = []; // Todos los anuncios
  anunciosFiltrados: any[] = []; // Anuncios después del filtro
  instrumentos: Instrumento[] = [];
  provincias: Provincia[] = [];
  filtroProvincia: string = '';
  filtroInstrumento: string = '';
  fechaInicioFiltro: string = '';
  fechaFinFiltro: string = '';
  nuevoAnuncio = { titulo: '', descripcion: '', idProvincia: '', fechaInicio: '', fechaFin: '' };


  private apiUrl =  environment.apiUrl;

  constructor(private authService: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    this.obtenerAnuncios();
    this.obtenerProvincias();
    this.obtenerInstrumentos();
    const hoy = new Date().toISOString().split('T')[0];
    this.fechaInicioFiltro = hoy;
  }

  obtenerAnuncios() {

    let params: any = {};

    if (this.filtroProvincia) {
      params.idProvincia = this.filtroProvincia;
    }
    if (this.filtroInstrumento) {
      params.idInstrumento = this.filtroInstrumento;
    }
    if (this.fechaInicioFiltro) {
      params.fechaInicio = this.fechaInicioFiltro || new Date().toISOString().split('T')[0]
    }
    if (this.fechaFinFiltro) {
      params.fechaFin = this.fechaFinFiltro;
    }
    this.http.get<any[]>(`${this.apiUrl}/anuncios_musicos`, { params }).subscribe(
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

  obtenerInstrumentos() {
    this.http.get<Instrumento[]>(`${this.apiUrl}/instrumentos`).subscribe(
      (data) => {
        this.instrumentos = data;
      },
      (error) => console.error('Error al cargar instrumentos', error)
    );
  }

  getFotoUrl(id: number): string {
    return `${this.apiUrl}/usuario/${id}/foto`; 
  }

  crearAnuncio() {
    const anuncioData = { ...this.nuevoAnuncio, idUsuario: this.user.idUsuario };
    this.http.post(`${this.apiUrl}/crear_anuncio_musico`, anuncioData).subscribe(() => {
      this.obtenerAnuncios();
      this.nuevoAnuncio = { titulo: '', descripcion: '', idProvincia: '', fechaInicio: '', fechaFin: '' };
    });
  }

}
