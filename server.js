'use strict';

require('dotenv').config();

const express = require('express');
const server = express();

const superagent = require('superagent');

const pg = require('pg');

const PORT = process.env.PORT || 3000;

server.set('view engine','ejs');

server.use(express.static('./public'));

server.use(express.urlencoded({extended:true}));

server.get( '/', homeRoute );
server.get( '/searches/new', searchRoute );
server.post( '/searches',booksRoute );
server.get( '/books/:id',booksDetails );
server.post( '/books' , choseBook );

const client = new pg.Client( {connectionString: process.env.DATABASE_URL,
  // ssl: {
  //   rejectUnauthorized : false
  // }
});


function homeRoute( req,res ){
  let SQL=`SELECT * FROM books ;`;
  client.query(SQL)
    .then (bookAppData=>{
      let bookCount = bookAppData.rows.length;

      res.render('pages/index',{books:bookAppData.rows,count:bookCount});
    })
    .catch(error=>{
      res.send(error);

      res.render('pages/searches/error', { errors: error });
    });

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
    .then(allBooks => {
      let bookData = allBooks.body.items;

      let bookArr = bookData.map(item => {
        return new Book (item); });

      res.render('pages/searches/show',{renderBookData:bookArr} );
    })
    .catch(error => {
      res.render('pages/searches/error', { errors: error });
    });
}

function Book (bookData){

  this.title = bookData.volumeInfo.title ? bookData.volumeInfo.title : 'Unkonown',
  this.authors = bookData.volumeInfo.authors? bookData.volumeInfo.authors : 'Unkonown',
  this.description = bookData.volumeInfo.description ? bookData.volumeInfo.description : 'Unkonown' ,
  this.imgUrl = bookData.volumeInfo.imageLinks? bookData.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
}

function booksDetails (req,res){
  let SQL=`SELECT * FROM books WHERE id=$1;`;
  let safeValues=[req.params.id];
  client.query(SQL,safeValues)
    .then(results=>{
      res.render('pages/books/detail',{detail:results.rows[0]});
    });

}

function choseBook (req,res){
  let {auther,title,isbn,image_url,description}=req.body;
  let SQL=`INSERT INTO books (author,title,isbn,image_url,description)VALUES ($1,$2,$3,$4,$5) RETURNING *;`;
  let safeValues=[auther,title,isbn,image_url,description];
  client.query(SQL,safeValues)
    .then(results =>{

      res.redirect(`/books/${results.rows[0].id}`);
    });
}

server.get('*',(req,res)=>{
  res.send('Error');
});

client.connect()
  .then(() => {
    server.listen(PORT, () =>
      console.log(`listening on ${PORT}`));

  }).catch(error=>{
    console.log(error);
  });
