NAME=noauth_server
SOURCE_DATE_EPOCH=$(git log -1 --pretty=%ct)
echo "Commit timestamp" $SOURCE_DATE_EPOCH

docker \
    run \
    -it \
    --rm \
    --privileged \
    -v .:/tmp/work \
    -w /tmp/work \
    --entrypoint buildctl-daemonless.sh \
    moby/buildkit:v0.20.1 \
    build \
    --no-cache \
    --frontend dockerfile.v0 \
    --opt build-arg:SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH} \
    --opt filename=./Dockerfile-enclave \
    --local dockerfile=. \
    --local context=. \
    --output type=docker,name=${NAME},dest=${NAME}.tar,rewrite-timestamp=true \

#    --progress=plain \
#    --rm \

#  buildctl 
#--output type=oci,dest=dest.tar,rewrite-timestamp=true \
#  --output type=image,name=example.com/foo:$SOURCE_DATE_EPOCH,buildinfo=false,push=$PUSH,rewrite-timestamp=true \
  

