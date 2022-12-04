#!/bin/bash
# 更新PB代码
protoc -I=./neos-protobuf --ts_out=./src/api/ocgcore ./neos-protobuf/idl/ocgcore.proto
npx eslint --ext .ts --ext .tsx src --fix
