#!/bin/bash

rm -rf build/
rm -rf dist/ 

mkdir build

cp -rf icons build/
cp -rf src/modals build/
cp -rf config/i18n/locales build/
cp src/index.html build/
