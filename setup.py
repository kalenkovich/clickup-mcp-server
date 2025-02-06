from setuptools import setup, find_packages

setup(
    name="clickup-mcp-server",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        'setuptools',
        'wheel',
        'types-setuptools'
    ],
    setup_requires=[
        'setuptools',
        'wheel',
        'types-setuptools'
    ]
)