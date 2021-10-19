import { Component, OnInit } from '@angular/core';
import { Users } from '../users';
import {  UsersService } from "../users.service";
import { Repos } from "../repos";


@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  users:any = Users;
  repos:any = Repos;
  
  constructor(private userService:  UsersService, public myRepos: UsersService) {}

  ngOnInit(): void { }

  doSearch(username: string){
 this.userService.getUsers(username);
 this.myRepos.getRepos(username);
 this.users = this.userService.users;
this.ngOnInit();
  }

}
