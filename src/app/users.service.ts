import { Injectable } from '@angular/core';
import { HttpClient  } from "@angular/common/http";
import { environment } from "../environments/environment";
import { Users } from "./users";
import { Repos } from "./repos";

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  users:any = Users;
  repos:any = Repos;
  newRepository: any;

  constructor(private http: HttpClient) {
    this.users = new Users("", "","", 0, "",  new Date(), 0, 0);
    this.repos = new Repos("", "", "", new Date());
   }

   getRepos (username:string){
    interface ApiResponse {
      name: string;
      description: string;
      html_url: string;
      created_at: Date;
       }

       let api = environment.apiUrl + '/' +username + '/repos?';

       let promise = new Promise((resolve ,  reject) => {
        this.http.get<ApiResponse>(api).toPromise().then(  getRepoResponse => {
          this.newRepository = getRepoResponse;
            console.log(this.newRepository);
          resolve(this.newRepository);
        },
        error => {
          
          reject(error);
        })
    })
    return promise;


   }

   getUsers (username:string){

     interface ApiResponse {
            html_url: string;
            description: string;
            created_at: Date;
            login: string;
            public_repos: number;
            followers: number;
            following: number;
            avatar_url: string;
     }
      let api = environment.apiUrl + '/' +username ;
      

      
      let promise = new Promise((resolve ,  reject) => {
        this.http.get<ApiResponse>(api).toPromise().then(  (response:any) => {
          this.users.html_url = response.html_url;
          this.users.description = response.description;
          this.users.created_at = response.created_at;
          this.users.login = response.login;
          this.users.public_repos  = response.public_repos;
          this.users.followers = response.followers;
          this.users.following = response.following;
          this.users.avatar_url = response.avatar_url;
          this.users.bio = response.bio;
          this.users.name = response.name;

          resolve(this.users);
        },
        error => {
          
          reject(error);
        })
    })
    return promise;

    

}
   }

