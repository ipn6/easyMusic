import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component'; 
import { RegisterComponent } from './components/register/register.component'; 
import { HomeComponent } from './components/home/home.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { CharangasComponent } from './components/charangas/charangas.component';
import { OfertasComponent } from './components/ofertas/ofertas.component';
import { ActosComponent } from './components/actos/actos.component';
import { MusicosComponent } from './components/musicos/musicos.component';

const routes: Routes = [
  { path: '', component: HomeComponent }, // Ruta por defecto
  { path: 'login', component: LoginComponent }, // Ruta para login
  { path: 'register', component: RegisterComponent }, // Ruta para registro
  { path: 'perfil', component: PerfilComponent }, // Ruta para perfil
  { path: 'charangas', component: CharangasComponent }, // Ruta para charangas
  { path: 'ofertas', component: OfertasComponent }, // Ruta para ofertas
  { path: 'actos', component: ActosComponent }, // Ruta para actos
  { path: 'musicos', component: MusicosComponent } // Ruta para musicos
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
