import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';


interface Provincia {
  idProvincia: number;
  nombre: string;
}

interface Instrumento{
  idInstrumento: number;
  nombre: string;
}

interface ValoracionTipoActo{
  idMusico: number;
  valoracion: number;
}

interface MusicoContratado{
  idMusico: number;
  nombre: string;
  email: string;
  telefono: string;
  instrumento: string;
  provincia: string;
  coche: number;
  valoracionCharanga: number;
  valoracionMusico: number;
  valoracionMusico2: number;
  valoracionCharanga2: number;
}

@Component({
  selector: 'app-actos',
  templateUrl: './actos.component.html',
  styleUrl: './actos.component.css'
})
export class ActosComponent {
  user: any = {};
  provincias:  Provincia[] = [];
  instrumentos: Instrumento[] = [];
  filtroProvincia: string = '';
  fechaInicioFiltro: string = '';
  fechaFinFiltro: string = '';
  filtroTipo: string = '';
  filtroInstrumento: string = '';
  actos: any[] = [];
  actoSeleccionado: any = {}; 
  actosFiltrados: any[] = [];
  actosUsuario: any[] = []; 
  valoracionesTipoActo: ValoracionTipoActo[] = []; // Valoraciones por tipo de acto
  musicosContratados: MusicoContratado[] = []; // Músicos contratados

  acto = { titulo: '', descripcion: '',  idCharanga:'', idProvincia: '', fechaInicio: '', 
    fechaFin: '', tipo:'',    musicos: [
      { cantidad: 1, idInstrumento: '' }]};
      
  private apiUrl =  environment.apiUrl;
  mostrarFormulario: boolean = false;
  solicitudesUser: any[] = []; // Solicitudes del usuario
  solicitudesRecibidas: any[] = []; // Solicitudes recibidas
  solicitudesSinResponder: any[] = []; // Solicitudes sin responder
  solicitudAceptada: any = {}; // Solicitud aceptada

  constructor(private authService: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    this.obtenerProvincias();
    this.obtenerInstrumentos();
    this.obtenerActos();
    this.obtenerSolicitudesUsuario();
    const hoy = new Date().toISOString().split('T')[0];
    this.fechaInicioFiltro = hoy;
    const dentroDeUnMes = new Date();
    dentroDeUnMes.setMonth(dentroDeUnMes.getMonth() + 1);
    this.fechaFinFiltro = dentroDeUnMes.toISOString().split('T')[0];
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


  
  obtenerDatosMusicos(idMusicos: [number], idActo: number) {
    this.http.get<any[]>(`${this.apiUrl}/datos_musicos`, { params: { idMusicos, idActo } }).subscribe(
      (data) => {
        this.musicosContratados = data;
        // inicializa a null los campos valoracionMusico2 y valoracionCharanga2 de cada musicoContratado
        this.musicosContratados.forEach(musico => {
          musico.valoracionMusico2 = 1;
          musico.valoracionCharanga2 = 1;
        });
        
        console.log("Datos de los músicos:", this.musicosContratados);
        
      },
      (error) => console.error("Error al obtener datos del músico:", error)
    );

  }

  agregarMusico() {
    this.acto.musicos.push({ cantidad: 1, idInstrumento: '' });
  }

  eliminarMusico(index: number) {
    if (this.acto.musicos.length > 1) {
      this.acto.musicos.splice(index, 1);
    }
  }

  getFotoUrl(id: number): string {
    return `${this.apiUrl}/usuario/${id}/foto`; 
  }

  obtenerActos() {
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
    if (this.filtroInstrumento){
      params.idInstrumento = this.filtroInstrumento;
    }
    this.http.get<any[]>(`${this.apiUrl}/actos`, { params }).subscribe(
      (data) => {
        console.log("Actos recibidos después de aplicar filtro:", data);
        this.actosFiltrados = data;
        this.actosUsuario = data.filter(acto => acto.idUsuario === this.user.idUsuario);
        console.log("Ãctos filtradas:", this.actosFiltrados);
        console.log("Actos del usuario:", this.actosUsuario);
      },
      (error) => {
        console.error("Error al obtener ofertas:", error);
      }
    );
  }

  getNombreInstrumento(idInstrumento: number): string{
    const instrumento = this.instrumentos.find(i => i.idInstrumento === idInstrumento);
    return instrumento ? instrumento.nombre : 'Desconocido';
  }

  comprobarMusicoInstrumento(act: any): boolean {
    return this.user.rol === 'musico' && act.musicos.some((musico: any) => musico.idInstrumento === this.user.idInstrumento);
  }

  crearActo() {
    const actoData = { ...this.acto, idCharanga: this.user.idUsuario };
    console.log("Datos del acto a crear:", actoData);
    this.http.post(`${this.apiUrl}/crear_acto`, actoData).subscribe(() => {
      this.obtenerActos();
      this.acto = { titulo: '', descripcion: '',  idCharanga:'', idProvincia: '', fechaInicio: '', 
        fechaFin: '', tipo:'', musicos: [
          { cantidad: 1, idInstrumento: '' }]};
    });
  }

  obtenerSolicitudesUsuario(){
    const idMusico = this.user.idUsuario;
    this.http.get<any[]>(`${this.apiUrl}/solicitudes_musico`, { params: { idMusico } }).subscribe(
      (data) => {
        this.solicitudesUser = data;
      },
      (error) => 
        console.error("Error al obtener solicitudes:", error)
    );
  }

  obtenerSolicitudesActo(idActo: number) {
    this.http.get<any[]>(`${this.apiUrl}/solicitudes_acto`, { params: { idActo } }).subscribe(
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

  contieneOferta(idActo: number): boolean {

    return this.solicitudesUser.some(solicitud => solicitud.idActo === idActo);
  }

  esRechazada(idActo: number): boolean {
    return this.solicitudesUser.some(solicitud => solicitud.idActo === idActo && solicitud.estado === 'Rechazada');
  }

  esAceptada(idActo: number): boolean {
    return this.solicitudesUser.some(solicitud => solicitud.idActo === idActo && (solicitud.estado === 'Aceptada' || 
      solicitud.estado === 'Valorada' || solicitud.estado === 'Finalizada'));
  }

  interesarse(acto: any) {
    const actoData = { ...acto, idMusico: this.user.idUsuario };
    this.http.post(`${this.apiUrl}/crear_solicitud_musico`, actoData).subscribe(() => {
      this.obtenerActos();
      this.obtenerSolicitudesUsuario();
    });
  }

  verActo(acto: any){
    this.actoSeleccionado = acto;
    this.obtenerSolicitudesActo(acto.idActo);
    const idMusicos = acto.musicosContratados.map((musico: any) => musico.idMusico);
    console.log(idMusicos);
    if (idMusicos.length > 0) {
      this.obtenerDatosMusicos(idMusicos, acto.idActo);
    }

    //this.obtenerValoracionesTipoActoSolicitud(acto.idActo, acto.tipo);
  }

  aceptarSolicitud(idActo: number, idMusico: number, idInstrumento: number) {
    
    this.http.post(`${this.apiUrl}/aceptar_solicitud_musico`, { idActo, idMusico, idInstrumento }).subscribe(() => {
      this.obtenerActos();
      this.obtenerSolicitudesActo(idActo);
    });
  }

  rechazarSolicitud(idActo: number, idMusico: number) {
    this.http.post(`${this.apiUrl}/rechazar_solicitud_musico`, { idActo, idMusico }).subscribe(() => {
      this.obtenerActos();
      this.obtenerSolicitudesActo(idActo);
    });
  }

    getValoracionMediaTipoActo(idUsuario: number, tipoActo: string): Observable<number> {
      return this.http.get<{ media: number }>(`${this.apiUrl}/valoracionMediaTipoActo`, {
        params: { idUsuario, tipoActo }
      }).pipe(map(res => res.media));
    }
  
    getValoracion(idMusico: number): number{
      const valoracion = this.valoracionesTipoActo.find(v => v.idMusico === idMusico);
      return valoracion ? valoracion.valoracion : 0;
    }

    obtenerValoracionesTipoActoSolicitud(idActo: number, tipoActo: string) {
      this.http.get<any[]>(`${this.apiUrl}/solicitudes_acto`, { params: { idActo } }).subscribe(
        (solicitudes) => {
          const observables = solicitudes.map((solicitud) =>
            this.getValoracionMediaTipoActo(solicitud.idMusico, tipoActo).pipe(
              map(media => ({ idMusico: solicitud.idMusico, valoracion: media }))
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

    asignarValoracionCharanga(idActo: number, idCharanga: number, idMusico: number, valoracion: number, tipoActo: string) {
      this.http.post(`${this.apiUrl}/asignar_valoracion_charanga_acto`, { idActo, idCharanga, idMusico, valoracion, tipoActo }).subscribe(() => {
        this.obtenerActos();
        this.obtenerSolicitudesActo(idActo);
        this.actualizarValoracionCharanga(idMusico, valoracion);
        this.setValoracionMedia(idCharanga, valoracion);
      });
    }
  
    asignarValoracionMusico(idActo: number, idMusico: number, valoracion: number,  tipoActo: string) {
      this.http.post(`${this.apiUrl}/asignar_valoracion_musico`, { idActo, idMusico, valoracion,  tipoActo}).subscribe(() => {
        this.obtenerActos();
        this.obtenerSolicitudesActo(idActo);
        this.actualizarValoracionMusico(idMusico, valoracion);
        this.setValoracionMedia(idMusico, valoracion);
      });
    }
  
    setValoracionMedia(idUsuario: number, valoracion: number) {
      this.http.post(`${this.apiUrl}/setValoracionMedia`, { idUsuario, valoracion }).subscribe(() => {
        this.obtenerActos();
      });
    }

    actualizarValoracionMusico(idMusico: number, valoracion: number){
      //busca en musicos contratados el id y actualiza el campo valoracionMusico
      const musico = this.musicosContratados.find(m => m.idMusico === idMusico);
      if (musico) {
        musico.valoracionMusico = valoracion;
      }
    }
    actualizarValoracionCharanga(idMusico: number, valoracion: number){
      //busca en musicos contratados el id y actualiza el campo valoracionCharanga
      const musico = this.musicosContratados.find(m => m.idMusico === idMusico);
      if (musico) {
        musico.valoracionCharanga = valoracion;
      }
    }

    
}
