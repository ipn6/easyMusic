import { NgModule } from '@angular/core';
import { BrowserModule} from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { CharangasComponent } from './components/charangas/charangas.component';
import { ActosComponent } from './components/actos/actos.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { HttpClientModule} from '@angular/common/http';
import { OfertasComponent } from './components/ofertas/ofertas.component';
import { MusicosComponent } from './components/musicos/musicos.component';

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    NavbarComponent,
    HomeComponent,
    CharangasComponent,
    ActosComponent,
    PerfilComponent,
    OfertasComponent,
    MusicosComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule

  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
