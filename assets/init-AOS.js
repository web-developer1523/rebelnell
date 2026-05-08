import AOS from 'aos';

AOS.init({
  easing: 'ease-out-quad',
  once: true,
  offset: 60,
  disableMutationObserver: true
});

export default AOS;
