<template>
  <div class="tela-inicial">
    <div class="rectangle-3"></div>
    <div class="rectangle"></div>
    <div class="sos">SOS</div>
    <div class="rectangle-6"></div>
    <div class="rectangle-4"></div>
    <div class="rectangle-2"></div>
    <div class="sua-senha-aqui">Sua senha aqui.</div>
    <div class="preferencial">Preferencial</div>
    <div class="rectangle-42"></div>
    <div class="rectangle-22"></div>
    <div class="sua-senha-aqui2">Sua senha aqui.</div>
    <div class="normal">Normal</div>
    <div class="bem-vindo-usu-rio">Bem vindo usuário</div>
    <div class="retire-sua-senha">retire sua senha</div>
    <div class="rectangle-11"></div>
    <div class="entrar-com-o-google">Entrar com o Google</div>
    <img class="rectangle-12" src="rectangle-120.png" />
    <div class="line-1"></div>
    <div class="line-2"></div>
    <div class="ou">ou</div>
  </div>
</template>
<script>
export default {
  name: "TelaInicial",
  components: {},
  props: {},
  data() {},
};
</script>
<style scoped>
.tela-inicial,
.tela-inicial * {
  box-sizing: border-box;
}
.tela-inicial {
  background: #ffffff;
  height: 1024px;
  position: relative;
  overflow: hidden;
}
.rectangle-3 {
  background: radial-gradient(
    closest-side,
    rgba(240, 243, 252, 1) 0%,
    rgba(143, 154, 210, 1) 100%
  );
  width: 1440px;
  height: 962px;
  position: absolute;
  left: 0px;
  top: 62px;
}
.rectangle {
  background: #000000;
  width: 1440px;
  height: 62px;
  position: absolute;
  left: 0px;
  top: 0px;
}
.sos {
  color: #ffffff;
  text-align: left;
  font-family: "Inter-Regular", sans-serif;
  font-size: 30px;
  font-weight: 400;
  position: absolute;
  left: 15px;
  top: 11px;
}
.group-10 {
  position: absolute;
  inset: 0;
}
.rectangle-6 {
  background: #f0f3fc;
  border-radius: 25px;
  width: 1137px;
  height: 916px;
  position: absolute;
  left: 191px;
  top: 85px;
}
.group-19 {
  position: absolute;
  inset: 0;
}
.rectangle-4 {
  background: linear-gradient(
    180deg,
    rgba(43, 56, 126, 1) 0%,
    rgba(143, 154, 210, 1) 100%
  );
  border-radius: 25px;
  width: 440px;
  height: 449px;
  position: absolute;
  left: 267px;
  top: 502px;
}
.rectangle-2 {
  background: #0f1a52;
  border-radius: 20px;
  width: 349px;
  height: 123px;
  position: absolute;
  left: 312px;
  top: 774px;
}
.sua-senha-aqui {
  color: #ffffff;
  text-align: center;
  font-family: "Inter-Regular", sans-serif;
  font-size: 40px;
  font-weight: 400;
  position: absolute;
  left: 316px;
  top: 812px;
  width: 349px;
  height: 47px;
}
.preferencial {
  color: #ffffff;
  text-align: left;
  font-family: "Inter-Regular", sans-serif;
  font-size: 60px;
  font-weight: 400;
  position: absolute;
  left: 312px;
  top: 593px;
  width: 408px;
}
.group-18 {
  position: absolute;
  inset: 0;
}
.rectangle-42 {
  background: linear-gradient(
    180deg,
    rgba(143, 154, 210, 1) 0%,
    rgba(43, 56, 126, 1) 100%
  );
  border-radius: 25px;
  width: 440px;
  height: 449px;
  position: absolute;
  left: 805px;
  top: 502px;
}
.rectangle-22 {
  background: #0f1a52;
  border-radius: 20px;
  width: 344px;
  height: 123px;
  position: absolute;
  left: 853px;
  top: 774px;
}
.sua-senha-aqui2 {
  color: #ffffff;
  text-align: center;
  font-family: "Inter-Regular", sans-serif;
  font-size: 40px;
  font-weight: 400;
  position: absolute;
  left: 820px;
  top: 810px;
  width: 401px;
  height: 52px;
}
.normal {
  color: #ffffff;
  text-align: left;
  font-family: "Inter-Regular", sans-serif;
  font-size: 60px;
  font-weight: 400;
  position: absolute;
  left: 922px;
  top: 590px;
  width: 303px;
  height: 61px;
}
.bem-vindo-usu-rio {
  color: #000000;
  text-align: left;
  font-family: "Inter-Regular", sans-serif;
  font-size: 50px;
  font-weight: 400;
  position: absolute;
  left: 542px;
  top: 102px;
}
.retire-sua-senha {
  color: #000000;
  text-align: left;
  font-family: "Inter-Regular", sans-serif;
  font-size: 50px;
  font-weight: 400;
  position: absolute;
  left: 569px;
  top: 163px;
}
.rectangle-11 {
  background: #f2f2f2;
  border-radius: 50px;
  width: 623px;
  height: 106px;
  position: absolute;
  left: 448px;
  top: 256px;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
}
.entrar-com-o-google {
  color: #000000;
  text-align: left;
  font-family: "Inter-Regular", sans-serif;
  font-size: 40px;
  font-weight: 400;
  position: absolute;
  left: 566px;
  top: 285px;
}
.rectangle-12 {
  border-radius: 100px;
  width: 60px;
  height: 62px;
  position: absolute;
  left: 491px;
  top: 278px;
  object-fit: cover;
}
.line-1 {
  margin-top: -1px;
  border-style: solid;
  border-color: #000000;
  border-width: 1px 0 0 0;
  width: 488px;
  height: 0px;
  position: absolute;
  left: 232px;
  top: 435px;
}
.line-2 {
  margin-top: -1px;
  border-style: solid;
  border-color: #000000;
  border-width: 1px 0 0 0;
  width: 488px;
  height: 0px;
  position: absolute;
  left: 805px;
  top: 435px;
}
.ou {
  color: #000000;
  text-align: left;
  font-family: "Inter-Regular", sans-serif;
  font-size: 30px;
  font-weight: 400;
  position: absolute;
  left: 742px;
  top: 417px;
}
</style>
