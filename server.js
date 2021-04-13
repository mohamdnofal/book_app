'use strict';

require('dotenv').config();

const express = require('express');
const server = express();

const superagent = require('superagent');

const PORT = process.env.PORT || 3000;

server.set('view engine','ejs');

server.use(express.static('./public'));

server.use(express.urlencoded({extended:true}));

server.get( '/', homeRoute );
server.get( '/searches/new', searchRoute );
server.post( '/searches',booksRoute );

function homeRoute (req,res){

  res.render('pages/index');

}

function searchRoute (req,res){

  res.render('pages/searches/new');

}

function booksRoute (req,res){

  let search = req.body.book;
  let bookAuthorURL;

  if (req.body.title === 'on')
  {
    bookAuthorURL = `https://www.googleapis.com/books/v1/volumes?q=intitle:${search}`;
  } else if (req.body.author === 'on')
  {
    bookAuthorURL = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${search}`;
  }
  superagent.get(bookAuthorURL)
    .then(fullBookData => {
      let bookData = fullBookData.body.items;

      let bookObjArr = bookData.map(item => {
        return new Book (item); });

      res.render('pages/searches/show',{renderBookData:bookObjArr} );
    })
    .catch(error => {
      res.render('pages/searches/error', { errors: error });
    });
}

function Book (oneBook){

  this.title = oneBook.volumeInfo.title ? oneBook.volumeInfo.title : 'Unkonown',
  this.authors = oneBook.volumeInfo.authors? oneBook.volumeInfo.authors : 'Unkonown',
  this.description = oneBook.volumeInfo.description ? oneBook.volumeInfo.description : 'Unkonown' ,
  this.imgUrl = oneBook.volumeInfo.imageLinks? oneBook.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
}

server.get('*',(req,res)=>{
  res.send('Error');
});

server.listen(PORT,()=>{
  console.log(`Listening on PORT ${PORT}`);
});
