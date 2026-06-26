const colorModeBootstrapScript = `(function(){try{var k='theme';var t=localStorage.getItem(k)||'system';var d=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var r=t==='system'?d:t;document.documentElement.classList.add(r);document.documentElement.style.colorScheme=r}catch(e){}})();`

export function ColorModeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: colorModeBootstrapScript }}
    />
  )
}
