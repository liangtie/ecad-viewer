# 在docker中使用kicad-cli输出allegro格式的网表

## 拉取最新的kicad镜像

docker pull kicad/kicad:nightly

## 查看kicad镜像id

docker images

<!-- Start a terminal and confirm -->

<!-- docker run -i -t 6d61f4c28457 -->

## 运行kicad cli 导出allegro格式的网表

docker run -v /home/hq/kicad:/home/kicad/ 6d61f4c28457 kicad-cli sch export netlist --format allegro /home/kicad/pspice.kicad_sch -o /home/kicad/pspice.txt

### 参数说明

-v /home/hq/kicad:/home/kicad/ : 挂载主机目录（/home/hq/kicad）到容器目录（/home/kicad/）
6d61f4c28457 : kicad镜像id
/home/kicad/pspice.kicad_sch ：主机下的kicad_sch文件(/home/hq/kicad/pspice.kicad_sch)，映射到容器之后的路径
/home/kicad/pspice.txt：输出的网表文件在容器中的路径，对应主机中的/home/hq/kicad/pspice.txt
