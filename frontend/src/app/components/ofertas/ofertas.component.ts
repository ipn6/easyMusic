import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';


interface Provincia {
  idProvincia: number;
  nombre: string;
}

interface ValoracionTipoActo{
  idCharanga: number;
  valoracion: number;
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
  fechaInicioFiltro: string = '';
  fechaFinFiltro: string = '';
  filtroTipo: string = '';
  solicitudesRecibidas: any[] = []; // Solicitudes recibidas
  solicitudesSinResponder: any[] = []; // Solicitudes sin responder
  solicitudAceptada: any = {}; // Solicitud aceptada
  solicitudesUser: any[] = []; // Solicitudes del usuario
  ofertas: any[] = []; // Todos las ofertas
  ofertaSeleccionada: any = {}; // Oferta seleccionada
  ofertasFiltradas: any[] = []; // Ofertas después del filtro
  ofertasUsuario: any[] = []; // Ofertas del usuario
  valoracionesTipoActo: ValoracionTipoActo[] = []; // Valoraciones por tipo de acto
  nuevaOferta = { titulo: '', descripcion: '', idCliente:'', idCharanga:'', idProvincia: '', fechaInicio: '', 
    fechaFin: '', direccion: '', tipo: '', contratada: '', valoracionCliente: '', valoracionCharanga: '', };
  private apiUrl =  environment.apiUrl;
  mostrarFormulario: boolean = false;

  constructor(private authService: AuthService, private http: HttpClient) {}
    
  ngOnInit() {
    this.user = this.authService.getUser();
    this.obtenerOfertas();
    this.obtenerProvincias();
    this.obtenerSolicitudesUsuario();
    const hoy = new Date().toISOString().split('T')[0];
    this.fechaInicioFiltro = hoy;
  }

  obtenerProvincias() {
    this.http.get<Provincia[]>(`${this.apiUrl}/provincias`).subscribe(
      (data) => {
        this.provincias = data;
      },
      (error) => console.error('Error al cargar provincias', error)
    );
  }

  obtenerSolicitudesUsuario(){
    const idCharanga = this.user.idUsuario;
    this.http.get<any[]>(`${this.apiUrl}/solicitudes_user`, { params: { idCharanga } }).subscribe(
      (data) => {
        this.solicitudesUser = data;
      },
      (error) => 
        console.error("Error al obtener solicitudes:", error)
    );
  }

  obtenerSolicitudesOferta(idOferta: number) {
    this.http.get<any[]>(`${this.apiUrl}/solicitudes`, { params: { idOferta } }).subscribe(
      (data) => {
        this.solicitudesRecibidas = data;
        this.solicitudesSinResponder = data.filter(solicitud => solicitud.estado === 'Pendiente');
        this.solicitudAceptada = data.find(solicitud => solicitud.estado === 'Aceptada' || solicitud.estado === 'Valorada') ||
          data.find(solicitud => solicitud.estado === 'Finalizada');
      },
      (error) => 
        console.error("Error al obtener solicitudes:", error)
    );
  }

  obtenerValoracionesTipoActoSolicitud(idOferta: number, tipoOferta: string) {
    this.http.get<any[]>(`${this.apiUrl}/solicitudes`, { params: { idOferta } }).subscribe(
      (solicitudes) => {
        const observables = solicitudes.map((solicitud) =>
          this.getValoracionMediaTipoActo(solicitud.idCharanga, tipoOferta).pipe(
            map(media => ({ idCharanga: solicitud.idCharanga, valoracion: media }))
          )
        );
  
        forkJoin(observables).subscribe(
          (result: ValoracionTipoActo[]) => {
            this.valoracionesTipoActo = result;
          },
          (error) => console.error(" Error al cargar valoraciones:", error)
        );
      },
      (error) => console.error("Error al obtener solicitudes:", error)
    );
  }

  obtenerOfertas() {
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
    if (this.filtroTipo) {
      params.tipo = this.filtroTipo;
    }
    this.http.get<any[]>(`${this.apiUrl}/ofertas`, { params }).subscribe(
      (data) => {
        this.ofertasFiltradas = data;
        this.ofertasUsuario = data.filter(oferta => oferta.idUsuario === this.user.idUsuario);
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
      this.nuevaOferta = { titulo: '', descripcion: '', idCliente:'', idCharanga:'', idProvincia: '', fechaInicio: '', 
        fechaFin: '', direccion: '', tipo: '', contratada: '', valoracionCliente: '', valoracionCharanga: '' };
    });
  }

  getFotoUrl(id: number): string {
    return `${this.apiUrl}/usuario/${id}/foto`; 
  }

  contieneOferta(idOferta: number): boolean {

    return this.solicitudesUser.some(solicitud => solicitud.idOferta === idOferta);
  }

  esRechazada(idOferta: number): boolean {
    return this.solicitudesUser.some(solicitud => solicitud.idOferta === idOferta && solicitud.estado === 'Rechazada');
  }

  esAceptada(idOferta: number): boolean {
    return this.solicitudesUser.some(solicitud => solicitud.idOferta === idOferta && (solicitud.estado === 'Aceptada' || 
      solicitud.estado === 'Valorada' || solicitud.estado === 'Finalizada'));
  }

  interesarse(oferta: any) {
    const ofertaData = { ...oferta, idCharanga: this.user.idUsuario };
    this.http.post(`${this.apiUrl}/crear_solicitud`, ofertaData).subscribe(() => {
      this.obtenerOfertas();
      this.obtenerSolicitudesUsuario();
    });
  }

  verOferta(oferta: any){
    this.ofertaSeleccionada = oferta;
    this.obtenerSolicitudesOferta(oferta.idOferta);
    this.obtenerValoracionesTipoActoSolicitud(oferta.idOferta, oferta.tipo);
  }

  aceptarSolicitud(idOferta: number, idCharanga: number) {
    this.http.post(`${this.apiUrl}/aceptar_solicitud`, { idOferta, idCharanga }).subscribe(() => {
      this.obtenerOfertas();
      this.obtenerSolicitudesOferta(idOferta);
    });
  }

  rechazarSolicitud(idOferta: number, idCharanga: number) {
    this.http.post(`${this.apiUrl}/rechazar_solicitud`, { idOferta, idCharanga }).subscribe(() => {
      this.obtenerOfertas();
      this.obtenerSolicitudesOferta(idOferta);
    });
  }

  asignarValoracionCharanga(idOferta: number, idCharanga: number, valoracion: number, tipoActo: string) {
    this.http.post(`${this.apiUrl}/asignar_valoracion_charanga`, { idOferta, idCharanga, valoracion, tipoActo }).subscribe(() => {
      this.obtenerOfertas();
      this.obtenerSolicitudesOferta(idOferta);
      this.setValoracionMedia(idCharanga, valoracion);
    });
  }

  asignarValoracionCliente(idOferta: number, idCharanga: number, idUsuario: number, valoracion: number) {
    this.http.post(`${this.apiUrl}/asignar_valoracion_cliente`, { idOferta, idCharanga, idUsuario, valoracion }).subscribe(() => {
      this.obtenerOfertas();
      this.obtenerSolicitudesOferta(idOferta);
      this.setValoracionMedia(idUsuario, valoracion);
    });
  }

  setValoracionMedia(idUsuario: number, valoracion: number) {
    this.http.post(`${this.apiUrl}/setValoracionMedia`, { idUsuario, valoracion }).subscribe(() => {
      this.obtenerOfertas();
    });
  }

  getValoracionMediaTipoActo(idUsuario: number, tipoActo: string): Observable<number> {
    return this.http.get<{ media: number }>(`${this.apiUrl}/valoracionMediaTipoActo`, {
      params: { idUsuario, tipoActo }
    }).pipe(map(res => res.media));
  }

  getValoracion(idCharanga: number): number{
    const valoracion = this.valoracionesTipoActo.find(v => v.idCharanga === idCharanga);
    return valoracion ? valoracion.valoracion : 0;
  }
  
}
