# HIDAProxy
HID API Proxy for Diagnostic tool


    #creates image
    docker build -t ts-proxy .

    #runs container and exposes it on host machine as port 4000
    docker run -d -p 4000:4000/tcp --name ts-proxy1 ts-proxy


    #check run logs
    docker logs -t ts-proxy1





When done


    #cleanup
    docker container stop ts-proxy1
    docker container rm ts-proxy1
    docker image rm ts-proxy