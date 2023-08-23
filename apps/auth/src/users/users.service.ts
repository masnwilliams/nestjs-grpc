import { Injectable } from '@nestjs/common';
import {
  CreateUserDto,
  PaginationDto,
  UpdateUserDto,
  User,
  Users,
} from '@app/common';
import { OnModuleInit } from '@nestjs/common/interfaces/hooks/on-init.interface';
import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly users: User[] = [];

  onModuleInit() {
    for (let i = 0; i < 100; i++) {
      this.create({
        username: randomUUID(),
        password: randomUUID(),
        age: Math.floor(Math.random() * 100),
      });
    }
  }

  create(createUserDto: CreateUserDto): User {
    const user: User = {
      ...createUserDto,
      subscribed: false,
      socialMedia: {},
      id: randomUUID(),
    };
    this.users.push(user);
    return user;
  }

  findAll(): Users {
    return {
      users: this.users,
    };
  }

  findOne(id: string) {
    return this.users.find((user) => user.id === id);
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    const user = this.users[userIndex];
    this.users[userIndex] = {
      ...user,
      ...updateUserDto,
    };
    return this.users[userIndex];
  }

  remove(id: string) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.users.splice(userIndex)[0];
  }

  query(paginationDtoStream: Observable<PaginationDto>): Observable<Users> {
    const subject = new Subject<Users>();

    const onNext = (paginationDto: PaginationDto) => {
      const { page, skip } = paginationDto;
      const start = page * skip;
      const end = start + skip;
      subject.next({
        users: this.users.slice(start, end),
      });
    };
    const onComplete = () => {
      subject.complete();
    };
    paginationDtoStream.subscribe({
      next: onNext,
      complete: onComplete,
    });
    return subject.asObservable();
  }
}
