#!/usr/bin/env python3
"""Génère lanceur.py en y incorporant index.html, pour une livraison en un seul fichier."""
import base64, pathlib, re
ici = pathlib.Path(__file__).resolve().parent
html = (ici / 'index.html').read_bytes()
modele = (ici / 'lanceur.py').read_text(encoding='utf-8')
blob = base64.b64encode(html).decode('ascii')
nouveau = re.sub(r"HTML_INCORPORE = '[^']*'", "HTML_INCORPORE = '" + blob + "'", modele, count=1)
(ici / 'lanceur.py').write_text(nouveau, encoding='utf-8')
print('lanceur.py régénéré :', len(nouveau), 'octets')
